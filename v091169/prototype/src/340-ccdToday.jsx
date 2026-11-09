// ช่องจำนวนเงิน — แสดงคอมมา + ทศนิยม 2 ตำแหน่งเมื่อไม่ได้พิมพ์ · พิมพ์ได้เป็นตัวเลขล้วน
function CcdMoneyInput({ value, onChange, disabled, over }) {
  const [txt, setTxt] = React.useState(null);
  const has = value !== '' && value != null && !isNaN(Number(value));
  const disp = has ? window.fmt.money(Number(value), 2) : '';
  return (
    <input className={'cfg-input mono' + (over ? ' ccd-over' : '')} inputMode="decimal" disabled={disabled} placeholder="0.00"
           style={{ width: '100%', minWidth: 104, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
           value={txt != null ? txt : disp}
           onFocus={() => setTxt(has ? String(Number(value)) : '')}
           onBlur={() => { if (txt != null && txt !== '') onChange(Number(txt).toFixed(2)); setTxt(null); }}
           onChange={(e) => { const t = e.target.value.replace(/[^0-9.]/g, ''); setTxt(t); onChange(t); }} />
  );
}
// ════════════════════════════════════════════════════════════════════
//  เปลี่ยนแปลงรายละเอียดสัญญา — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง: ① ข้อมูลสมาชิก + ข้อมูลสัญญา ② สรุป (stat) ③ รายละเอียด
//             การค้ำประกัน (ตารางแก้ไขได้) ④ หมายเหตุ + ข้อมูลแก้ไขล่าสุด
//  ใช้สมาชิก/สัญญาจาก DN_MEMBERS · DnMemberSearchModal (data/components-debt-notice)
// ════════════════════════════════════════════════════════════════════

const ccdToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function CcdFld({ label, w, grow, fill, span, required, children }) {
  const style = fill ? { minWidth: 0, gridColumn: span ? `span ${span}` : undefined } : grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function CcdRO({ value, mono, num, danger, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')}
         title={empty ? undefined : String(value)} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums' }}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// แปลงค่า type เก่าของระบบ (CCD) → รายการประเภทหลักประกันของหน้าสร้างใบคำขอกู้ (LR_COLL_KINDS)
const CCD_TYPE_MAP = { land: 'asset', other: 'asset' };
const ccdCollKind = (v) => {
  const kinds = window.LR_COLL_KINDS || window.CCD_COLLATERAL_TYPES || [];
  const mapped = CCD_TYPE_MAP[v] || v;
  return kinds.some(k => k.v === mapped) ? mapped : (kinds[0] ? kinds[0].v : mapped);
};

// เงินเดือนผู้ค้ำ — ดึงจากฐานเงินเดือนสมาชิก
const ccdSalaryOf = (code) => {
  const m = [window.DN_MEMBERS, window.MEMBERS_LIST, window.GUAR_MEMBERS].flatMap(l => l || []).find(x => x && x.code === code && x.salary);
  return (m && Number(m.salary)) || (window.SCHREQ_SALARY || {})[code] || 0;
};

// popup ดูหลักประกัน — โครงเดียวกับใบคำขอกู้ (CollateralDetailModal) · เติมข้อมูลจากแถวของสัญญา
const ccdCollView = (r, member, base) => {
  const kinds = window.LR_COLL_KINDS || [];
  const k = kinds.find(x => x.v === r.type) || {};
  const tpl = ((window.LR_DEMO && window.LR_DEMO.collaterals) || []).find(c => c.view && c.view.kind === r.type);
  const view = tpl ? JSON.parse(JSON.stringify(tpl.view)) : { kind: r.type, typeName: k.l, rows: [] };
  const amt = Number(r.guaranteed) || 0, avail = Number(r.available) || 0;
  const pct = (base > 0 ? Math.min(100, amt / base * 100) : 0).toFixed(2) + '%';
  const nm = String(r.detail || '').trim();
  const parts = nm.replace(/^(นาย|นางสาว|นาง|น\.ส\.)/, '').split(/\s+/);
  const mcode = member ? String(member.code).replace(/^M-/, '') : '';
  const mname = member ? member.name : '';
  if (view.limit) view.limit = { max: avail, used: Math.max(0, avail - amt), locked: 0, remain: avail, pct, ok: amt };
  if (r.type === 'person' || r.type === 'share') {
    const nm2 = r.type === 'person' ? parts : String(mname).replace(/^(นาย|นางสาว|นาง|น\.ส\.)/, '').split(/\s+/);
    view.rows = (view.rows || []).slice(0, 1).map(x => ({ ...x, fname: nm2[0] || '', lname: nm2.slice(1).join(' '), pct }));
  } else if (r.type === 'deposit') {
    view.rows = [{ accNo: r.securityNo, accName: mname, memberNo: mcode, memberName: mname, depType: 'เงินฝากออมทรัพย์' }];
  } else if (r.type === 'asset') {
    const at = (nm.match(/^(โฉนด|นส3ก|นส3|โฉนดตราจอง|ห้องชุด|สิ่งปลูกสร้าง)/) || [])[1] || 'โฉนด';
    view.rows = [{ reg: r.securityNo, assetNo: r.securityNo, assetType: at, memberNo: mcode, memberName: mname, loanType: 'กู้สามัญ', mortgagePrice: avail }];
  } else if (r.type === 'bond') {
    view.rows = [{ bondNo: r.securityNo, ownerName: mname, memberNo: mcode, memberName: mname, bondType: 'พันธบัตรรัฐบาล' }];
  }
  return { type: k.l, code: k.code, ref: r.securityNo, detail: r.detail, view };
};

const CCD_MODULES = [
  'ทะเบียนและติดตามหนี้ — เปลี่ยนแปลงรายละเอียดสัญญา',
];

// Modal ประวัติการแก้ไข — ไทม์ไลน์จาก Audit Trail (layout กลางเดียวกับหน้ารายละเอียดประเภทเงินกู้)
function CcdHistoryModal({ title, onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = (ctx && ctx.entries) || window.AUDIT_SEED || [];
  const rows = all
    .filter((e) => CCD_MODULES.includes(e.module))
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 640, width: '92vw' }}>
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการแก้ไข</h2>
            <div className="muted" style={{ fontSize: 11 }}>{title}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {rows.length === 0 ? (
            <div className="muted" style={{ padding: '20px 2px', textAlign: 'center', fontSize: 13 }}>
              ยังไม่มีประวัติการแก้ไข
            </div>
          ) : (
            <div className="tx-timeline">
              {rows.map((e) => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={'tx-dot ' + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={'pill ' + a.pill}>{a.label}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{window.fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span>
                        <span className="sep">·</span>
                        <span className="mono muted">{e.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn sm" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function CcdFormScreen({ onToast, audit, title, subtitle, screenLabel }) {
  const { useState } = React;
  const today = ccdToday();
  title = title || 'เปลี่ยนแปลงรายละเอียดสัญญา';
  subtitle = subtitle || 'ระบบงานทะเบียนและติดตามหนี้ · ปรับปรุงรายละเอียดสัญญา หลักประกัน และผู้ค้ำประกัน';
  screenLabel = screenLabel || 'เปลี่ยนแปลงรายละเอียดสัญญา';

  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [collSearchRow, setCollSearchRow] = useState(null);   // index แถวที่กำลังค้นหาผู้ค้ำ
  const [updatedDate, setUpdatedDate] = useState(today);
  const [purpose, setPurpose] = useState('');
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState('');
  const [savedNo, setSavedNo] = useState('');
  const [lastEdit, setLastEdit] = useState(null);   // { by, at }
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [editing, setEditing] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [okMsg, setOkMsg] = useState(null);
  const [viewRow, setViewRow] = useState(null);   // popup ดูข้อมูลหลักประกัน
  const regAssets = React.useMemo(() => (member && window.lcOf ? window.lcOf(member.code) : [])
    .map(a => ({ ...a, _sv: window.lrAssetSurveyInfo(a) })), [member && member.code]);
  const snapRef = React.useRef(null);   // ค่าก่อนเข้าโหมดแก้ไข (สำหรับปุ่มยกเลิก)

  const contracts = member ? (member.debts || []) : [];
  const contract = contracts.find(d => d.contractNo === contractNo) || null;
  const info = contract ? window.ccdContractInfo(contract) : null;
  const loaded = !!info;

  // ── สรุปยอดค้ำประกัน + เปอร์เซ็นต์ (อ้างอิงยอดอนุมัติ) ──
  const totalGuaranteed = rows.reduce((s, r) => s + (Number(r.guaranteed) || 0), 0);
  const base = info ? info.approvedAmount : 0;
  const rowPct = (r) => base > 0 ? Math.min(100, (Number(r.guaranteed) || 0) / base * 100) : 0;
  const totalPct = base > 0 ? Math.min(100, totalGuaranteed / base * 100) : 0;
  const rawTotalPct = base > 0 ? totalGuaranteed / base * 100 : 0;

  const loadContract = (m, debt) => {
    setMember(m);
    setContractNo(debt.contractNo);
    setRows(window.ccdCollateral(debt.contractNo).map(r => ({ ...r, type: ccdCollKind(r.type), salary: Number(r.salary) || (r.type === 'person' ? ccdSalaryOf(r.securityNo) : 0) })));
    setNote('');
    setSavedNo('');
    setLastEdit({ by: window.CCD_USER, at: `${window.fmt.date(today)} 09:30 น.` });
    setUpdatedDate(today);
    setError('');
    const i = window.ccdContractInfo(debt);
    setPurpose(i.purpose || '');
    snapRef.current = null;
    setWarn(i.interestArrears > 0 ? `สัญญานี้มีดอกเบี้ยค้างชำระ ${window.fmt.money(i.interestArrears, 2)} บาท — โปรดพิจารณาก่อนบันทึกการเปลี่ยนแปลง` : '');
  };
  const pickMember = (m) => {
    const first = (m.debts || [])[0];
    if (first) loadContract(m, first);
    else { setMember(m); setContractNo(''); setRows([]); setError('สมาชิกรายนี้ไม่มีสัญญาเงินกู้คงค้าง'); setWarn(''); }
  };
  const pickContract = (no) => {
    const c = contracts.find(d => d.contractNo === no);
    if (c) loadContract(member, c);
  };

  // ── จัดการตารางหลักประกัน ──
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const addRow = () => {
    if (!loaded) { setError('กรุณาเลือกสัญญาก่อนเพิ่มรายการหลักประกัน'); return; }
    setRows(rs => [...rs, { type: 'person', securityNo: '', detail: '', salary: 0, available: 0, guaranteed: 0 }]);
  };
  const removeRow = (i) => setRows(rs => rs.filter((_, idx) => idx !== i));
  // เปิด popup ค้นหาสมาชิก (ผู้ค้ำประกัน) สำหรับแถว — รูปแบบกลาง DS
  const openCollSearch = (i) => {
    if (rows[i].type !== 'person') return;
    setCollSearchRow(i);
  };
  const pickCollMember = (m) => {
    if (collSearchRow == null) return;
    updateRow(collSearchRow, { securityNo: m.code, detail: m.name, salary: m.salary || ccdSalaryOf(m.code) });
    setCollSearchRow(null);
  };

  const clearScreen = () => {
    setMember(null); setContractNo(''); setRows([]); setNote(''); setPurpose('');
    setSavedNo(''); setLastEdit(null); setUpdatedDate(today);
    setError(''); setWarn(''); setEditing(false); snapRef.current = null;
  };

  // ── เข้า/ออกโหมดแก้ไข ──
  const startEdit = () => {
    if (!loaded) return;
    snapRef.current = { rows: rows.map(r => ({ ...r })), note, purpose, updatedDate };
    setError(''); setEditing(true);
  };
  const cancelEdit = () => {
    const s = snapRef.current;
    if (s) { setRows(s.rows.map(r => ({ ...r }))); setNote(s.note); setPurpose(s.purpose); setUpdatedDate(s.updatedDate); }
    snapRef.current = null;
    setError(''); setEditing(false);
  };

  const validate = () => {
    if (!member) return 'กรุณาระบุเลขทะเบียนสมาชิกก่อนบันทึก';
    if (!contract) return 'กรุณาเลือกสัญญาเงินกู้ที่ต้องการเปลี่ยนแปลง';
    if (!updatedDate) return 'กรุณาระบุวันที่ปรับปรุง';
    if (rows.length === 0) return 'ต้องมีรายการหลักประกัน/ผู้ค้ำประกันอย่างน้อย 1 รายการ';
    // ค้ำประกันต้องไม่เกินค้ำคงเหลือ
    const over = rows.find(r => (Number(r.guaranteed) || 0) > (Number(r.available) || 0));
    if (over) return `ยอดค้ำประกัน "${over.detail || over.securityNo || '(รายการใหม่)'}" เกินยอดค้ำคงเหลือ`;
    // ผู้ค้ำต้องไม่ซ้ำ
    const persons = rows.filter(r => r.type === 'person' && r.securityNo).map(r => r.securityNo);
    const dup = persons.find((p, i) => persons.indexOf(p) !== i);
    if (dup) return `พบผู้ค้ำประกันซ้ำในสัญญาเดียวกัน (${dup}) — กรุณาตรวจสอบ`;
    if (rawTotalPct > 100) return `สัดส่วนค้ำประกันรวม ${rawTotalPct.toFixed(2)}% เกิน 100% ของยอดอนุมัติ — กรุณาปรับยอดค้ำประกัน`;
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); setWarn(''); return; }
    setError('');
    const beYear = new Date().getFullYear() + 543;
    const no = window.ccdNextNo(beYear);
    setSavedNo(no);
    const at = `${window.fmt.date(today)} ${new Date().toTimeString().slice(0, 5)} น.`;
    setLastEdit({ by: window.CCD_USER, at });
    audit && audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — เปลี่ยนแปลงรายละเอียดสัญญา',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกเอกสาร ${no} · สัญญา ${contractNo} · ค้ำประกันรวม ${window.fmt.money(totalGuaranteed, 0)} บาท (${totalPct.toFixed(2)}%)`,
      changes: [
        { field: 'จำนวนรายการค้ำประกัน', before: '—', after: String(rows.length) },
        { field: 'ยอดค้ำประกันรวม', before: '—', after: window.fmt.money(totalGuaranteed, 2) },
        ...(purpose !== info.purpose ? [{ field: 'วัตถุประสงค์การกู้', before: info.purpose || '—', after: purpose }] : []),
        ...(note ? [{ field: 'หมายเหตุ', before: '—', after: note }] : []),
      ],
    });
    onToast && onToast(`บันทึกการเปลี่ยนแปลงสัญญา ${contractNo} (${no}) เรียบร้อยแล้ว`);
    setOkMsg({
      title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      detail: `บันทึกการเปลี่ยนรายละเอียดสัญญา ${contractNo} · เลขที่เอกสาร ${no} · ค้ำประกันรวม ${window.fmt.money(totalGuaranteed, 2)} บาท (${totalPct.toFixed(2)}%) เรียบร้อยแล้ว`,
    });
    snapRef.current = null;
    setEditing(false);
  };

  const doPrint = () => {
    if (!loaded) { setError('กรุณาเลือกสัญญาก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์เอกสารสรุปการเปลี่ยนแปลงรายละเอียดสัญญา…');
    setTimeout(() => window.print(), 80);
  };

  // ── badge “บันทึกล่าสุด” — เวลาจาก Audit Trail ของเมนูนี้ ──
  const savedBadge = (() => {
    if (!loaded) return null;
    const entries = (audit && audit.entries) || window.AUDIT_SEED || [];
    const ts = window.savedBadgeTs ? window.savedBadgeTs(entries, CCD_MODULES, 'ccd.' + contractNo) : null;
    return (window.savedBadgeLabel && window.savedBadgeLabel(ts)) || null;
  })();

  return (
    <div data-screen-label={screenLabel}>
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>{title}</h1>
            <div className="icr-form-sub">{subtitle}</div>
          </div>
        </div>
        <div className="icr-form-actions">
          {editing ? (
            <>
              <button className="btn sm" onClick={cancelEdit}>ยกเลิก</button>
              <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
            </>
          ) : (
            <>
              {savedBadge && <span className="saved-badge">{savedBadge}</span>}
              <button className="btn sm" onClick={() => setHistOpen(true)} disabled={!loaded}><Icon name="history" size={13} /> ประวัติ</button>
              <button className="btn sm" onClick={doPrint} disabled={!loaded}><Icon name="print" size={13} /> พิมพ์เอกสาร</button>
              <button className="btn primary sm" onClick={startEdit} disabled={!loaded}><Icon name="edit" size={13} /> แก้ไขข้อมูล</button>
            </>
          )}
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {warn && !error && (<div className="dn-status-alert warn" style={{ marginBottom: 12 }}><Icon name="info" size={15} /><span>{warn}</span></div>)}

      {/* ── ข้อมูลสมาชิก + ข้อมูลสัญญา ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
          {loaded && <span className="chip warning" style={{ marginLeft: 'auto' }}>REQ</span>}
        </div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gridAutoFlow: 'row dense' }}>
          <CcdFld label="เลขสมาชิก / เลขที่สัญญา" fill span={2} required>
            <ContractSearchField contract={contractNo} member={member}
                                 onPick={({ member: m, debt }) => loadContract(m, debt)}
                                 source={window.DN_MEMBERS}
                                 title="ค้นหาสัญญาเงินกู้ — ปรับปรุงรายละเอียดสัญญา"
                                 placeholder="เลขสมาชิก หรือเลขที่สัญญา…" />
          </CcdFld>
          <CcdFld label="ชื่อ-นามสกุล" fill span={2}><CcdRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></CcdFld>
          <CcdFld label="สังกัด" fill span={2}><CcdRO value={member ? `${member.deptCode || ''}  ${member.dept || ''}`.trim() : ''} /></CcdFld>
          <CcdFld label="ลาออก" fill><CcdRO value={member && member.status === 'ลาออก' ? '01/2565' : (member ? '-' : '')} mono /></CcdFld>
          <CcdFld label="เกษียณ" fill><CcdRO value={member ? '-' : ''} mono /></CcdFld>
          <CcdFld label="สถานะสมาชิก" fill><CcdRO value={member ? 'สมาชิกใช้งาน' : ''} /></CcdFld>
        </div>
      </div>

      <div className="search-card icr-sec">
          <div className="section-head"><span className="head-bar" /><h3>รายละเอียดสัญญา</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gridAutoFlow: 'row dense', gap: '14px 18px' }}>
            <CcdFld label="เลขที่สัญญา" fill span={3} required>
              <select className="cfg-input mono" value={contractNo} onChange={(e) => pickContract(e.target.value)} disabled={!member || contracts.length === 0}>
                {!member && <option value="">— เลือกสมาชิกก่อน —</option>}
                {member && contracts.length === 0 && <option value="">— ไม่มีสัญญา —</option>}
                {contracts.map(d => <option key={d.contractNo} value={d.contractNo}>{d.contractNo}</option>)}
              </select>
            </CcdFld>
            <CcdFld label="โครงการเงินกู้" fill span={2}><CcdRO value={info ? (info.project || (info.loanType + (info.startDate ? ' ปี ' + (new Date(info.startDate).getFullYear() + 543) : ''))) : ''} /></CcdFld>
            <CcdFld label="วันที่ปรับปรุง" fill span={2} required>
              <ErpDate value={updatedDate} onChange={setUpdatedDate} disabled={!loaded} />
            </CcdFld>
            <CcdFld label="ยอดอนุมัติ" fill><CcdRO value={info ? window.fmt.money(info.approvedAmount, 2) : ''} mono num /></CcdFld>
            <CcdFld label="ยอดรอเบิก" fill><CcdRO value={info ? window.fmt.money(info.pendingDisburse, 2) : ''} mono num /></CcdFld>
            <CcdFld label="ยอดคงเหลือ" fill><CcdRO value={info ? window.fmt.money(info.outstanding, 2) : ''} mono num /></CcdFld>
            <CcdFld label="งวดชำระล่าสุด" fill><CcdRO value={info ? info.lastPaidTerm : ''} mono num /></CcdFld>
            <CcdFld label="วันที่เริ่มสัญญา" fill><CcdRO value={info && info.startDate ? (() => {
              const dt = new Date(info.startDate); const p = (n) => String(n).padStart(2, '0');
              return isNaN(dt) ? String(info.startDate) : `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear() + 543}`;
            })() : ''} mono /></CcdFld>
            <CcdFld label="ดอกเบี้ยค้าง" fill span={2}><CcdRO value={info ? window.fmt.money(info.interestArrears, 2) : ''} mono num danger={info && info.interestArrears > 0} /></CcdFld>
          </div>
      </div>

      {/* ── รายละเอียดการค้ำประกัน ── */}
      <div className="search-card icr-sec">
        <div className="section-head">
          <span className="head-bar" /><h3>รายละเอียดการค้ำประกัน</h3>
          <div className="head-actions">
            <button className="btn sm primary" onClick={addRow} disabled={!editing}><Icon name="plus" size={13} /> เพิ่มแถว</button>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl ccd-coll-tbl" style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ width: 150 }}>ประเภทหลักประกัน</th>
                <th style={{ width: 258 }}>เลขที่อ้างอิง</th>
                <th style={{ minWidth: 200 }}>รายละเอียด</th>
                <th className="num" style={{ width: 120 }}>เงินเดือน</th>
                <th className="num" style={{ width: 120 }}>ค้ำคงเหลือ</th>
                <th className="num" style={{ width: 140 }}>ค้ำประกัน</th>
                <th className="num" style={{ width: 120 }}>คำนวณ %</th>
                <th className="center" style={{ width: 56 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {!loaded ? (
                <tr><td colSpan="8" className="empty-state">เลือกสัญญาเพื่อแสดงรายละเอียดหลักประกัน / ผู้ค้ำประกัน</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">ยังไม่มีรายการ — กด “เพิ่มแถว” เพื่อบันทึกหลักประกัน / ผู้ค้ำประกัน</td></tr>
              ) : rows.map((r, i) => {
                const over = (Number(r.guaranteed) || 0) > (Number(r.available) || 0);
                return (
                  <tr key={i}>
                    <td>
                      <select className="cfg-input" value={r.type} disabled={!editing} onChange={(e) => updateRow(i, { type: e.target.value })}>
                        {(window.LR_COLL_KINDS || window.CCD_COLLATERAL_TYPES).map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                    </td>
                    <td className="mono lrq-ref-cell">
                      <div className="lrq-refbox">
                        {r.type === 'person' ? (
                          <div className="lrq-coll-member" style={editing ? null : { pointerEvents: 'none', opacity: .85 }}>
                            <ErpMemberPicker member={r.securityNo ? { code: r.securityNo, name: r.detail } : null}
                              onPick={(m) => updateRow(i, { securityNo: m.code, detail: m.name, salary: m.salary || ccdSalaryOf(m.code) })}
                              source={window.DN_MEMBERS} title="ค้นหาผู้ค้ำประกัน" placeholder="เลขสมาชิกผู้ค้ำ…" />
                          </div>
                        ) : r.type === 'asset' ? (
                          <select className="cfg-input lrq-rowsel" value={r.assetId || (r.securityNo ? '__cur' : '')} disabled={!editing}
                                  onChange={(e) => {
                                    const as = regAssets.find(x => x.id === e.target.value);
                                    if (!as) { if (e.target.value === '') updateRow(i, { assetId: '', securityNo: '', detail: '' }); return; }
                                    if (!as._sv.ok) { onToast && onToast('ใช้ค้ำไม่ได้ — ' + as._sv.reason + ' (ดำเนินการที่เมนูสำรวจหลักทรัพย์)'); return; }
                                    const loc = as.locProvince || as.landOfficeProvince || '';
                                    updateRow(i, { assetId: as.id, securityNo: as.code || as.titleNo || as.id,
                                      detail: [as.type, as.titleNo ? 'เลขที่โฉนด ' + as.titleNo : '', loc].filter(Boolean).join(' · '),
                                      available: as._sv.remainRight });
                                  }}>
                            <option value="">{regAssets.some(x => x._sv.ok) ? '--- เลือกหลักทรัพย์ที่สรุปผลสำรวจแล้ว ---' : '— ไม่มีหลักทรัพย์ที่สรุปผลสำรวจแล้ว —'}</option>
                            {!r.assetId && r.securityNo && <option value="__cur">{r.securityNo}</option>}
                            {regAssets.map(x => <option key={x.id} value={x.id} disabled={!x._sv.ok}>
                              {[x.type, x.code || x.titleNo].filter(Boolean).join(' · ') + (x._sv.ok ? ' · ค้ำสูงสุด ฿' + window.fmt.money(x._sv.maxRight, 2) : ' (' + x._sv.reason + ')')}
                            </option>)}
                          </select>
                        ) : (
                          <input className="cfg-input sm mono" value={r.securityNo} disabled={!editing} placeholder="เลขที่อ้างอิง"
                                 onChange={(e) => updateRow(i, { securityNo: e.target.value })} />
                        )}
                      </div>
                      {r.securityNo && (
                        <button className="lrq-eyebtn lrq-eyebtn-g act-view" title="ดูข้อมูล" onClick={() => setViewRow(r)}
                                style={{ background: '#fff', border: '1px solid var(--primary)', color: 'var(--primary)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="eye" size={14} /></button>
                      )}
                    </td>
                    <td>{r.detail || <span className="lrq-dash">-</span>}</td>
                    <td className="num">
                      <CcdMoneyInput value={r.salary} disabled={!editing} onChange={(v) => updateRow(i, { salary: v })} />
                    </td>
                    <td className="num mono" style={{ whiteSpace: 'nowrap' }}>{window.fmt.money(r.available, 2)}</td>
                    <td className="num">
                      <div className="icr-suffix">
                        <CcdMoneyInput value={r.guaranteed} over={over} disabled={!editing} onChange={(v) => updateRow(i, { guaranteed: v })} />
                      </div>
                    </td>
                    <td className="num">
                      <CcdMoneyInput value={rowPct(r).toFixed(2)} disabled={!editing}
                                     onChange={(v) => updateRow(i, { guaranteed: base > 0 ? String(Math.round(base * (Number(v) || 0)) / 100) : r.guaranteed })} />
                    </td>
                    <td className="center">
                      <button className="btn text sm danger ccd-del act-del" title="ลบรายการ" disabled={!editing} onClick={() => removeRow(i)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {loaded && rows.length > 0 && (
              <tfoot>
                <tr className="ccd-total-row">
                  <td colSpan="5" className="ccd-total-label">รวม</td>
                  <td className="num mono">{window.fmt.money(totalGuaranteed, 2)}</td>
                  <td className="num mono">{totalPct.toFixed(2)}%</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
        {loaded && totalPct > 0 && totalPct < 100 && (
          <div className="icr-restruct-note" style={{ marginTop: 10 }}>
            <Icon name="info" size={13} />
            <span>สัดส่วนค้ำประกันรวม {totalPct.toFixed(2)}% ยังไม่ครบ 100% ของยอดอนุมัติ — โปรดตรวจสอบความเพียงพอของหลักประกันก่อนบันทึก</span>
          </div>
        )}
      </div>

      {/* ── หมายเหตุ + ข้อมูลแก้ไขล่าสุด ── */}
      <div>
        <div className="search-card icr-sec">
          <div className="section-head"><span className="head-bar" /><h3>หมายเหตุการเปลี่ยนแปลง</h3></div>
          <div className="icr-note-wrap">
            <textarea className="cfg-input" rows={4} value={note} onChange={(e) => setNote(e.target.value)} disabled={!loaded || !editing} maxLength={500}
                      placeholder="ระบุเหตุผล/รายละเอียดการเปลี่ยนแปลง เช่น ปรับลดวงเงินค้ำประกันเนื่องจากมีการชำระเงินบางส่วนแล้ว" />
            <span className="icr-note-count">{note.length}/500</span>
          </div>
        </div>
      </div>

      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail}
                            onClose={() => setOkMsg(null)} />
      )}

      {viewRow && window.CollateralDetailModal && (
        <window.CollateralDetailModal coll={ccdCollView(viewRow, member, base)} onClose={() => setViewRow(null)} />
      )}

      {histOpen && (
        <CcdHistoryModal title={contractNo ? `สัญญา ${contractNo}${member ? ' · ' + member.name : ''}` : title}
                         onClose={() => setHistOpen(false)} />
      )}

      {collSearchRow != null && (
        <MemberSearchModal onPick={pickCollMember} onClose={() => setCollSearchRow(null)}
                           title="ค้นหาผู้ค้ำประกัน" source={window.DN_MEMBERS} searchFn={window.ccdSearchMembers} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function ContractChangePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <CcdFormScreen onToast={onToast} audit={audit} />;
}

// ระบบสินเชื่อ — ปรับปรุงรายละเอียดสัญญา (แก้ไขข้อมูลผู้ค้ำประกัน) — ใช้หน้าจอเดียวกัน
function ContractAdjustPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <CcdFormScreen onToast={onToast} audit={audit}
    title="ปรับปรุงรายละเอียดสัญญา"
    subtitle="ระบบสินเชื่อ · ปรับปรุงรายละเอียดสัญญา และแก้ไขข้อมูลผู้ค้ำประกัน"
    screenLabel="ปรับปรุงรายละเอียดสัญญา" />;
}

Object.assign(window, { ContractChangePage, ContractAdjustPage, CcdFormScreen, CcdHistoryModal });
